#!/usr/bin/env python3
"""Actualiza el minuto a minuto usando solamente notas vinculadas desde la etiqueta oficial."""
from __future__ import annotations
import datetime as dt
import json
import logging
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

SOURCES = [
    'https://www.eltribuno.com/ttag/el-papa-leon-xiv-en-la-argentina',
    'https://www.eltribuno.com/ttag/papa-leon-xiv-en-argentina',
]
SOURCE = SOURCES[0]
BASE = 'https://www.eltribuno.com'
OUT = Path(__file__).resolve().parents[1] / 'data' / 'latest.json'
TZ = ZoneInfo('America/Argentina/Buenos_Aires')
LOG = logging.getLogger('minuto-a-minuto')
HEADERS = {'User-Agent':'Mozilla/5.0 (compatible; ElTribunoEspecial/1.0; +https://www.eltribuno.com/)', 'Accept-Language':'es-AR,es;q=0.9'}
SESSION = requests.Session();SESSION.headers.update(HEADERS)


def get_soup(url: str) -> BeautifulSoup:
    r = SESSION.get(url,timeout=22)
    r.raise_for_status()
    return BeautifulSoup(r.text,'html.parser')


def normal(txt: str|None) -> str:
    return re.sub(r'\s+',' ',txt or '').strip()


def meta(soup:BeautifulSoup,*keys:str)->str:
    for k in keys:
        for attr in ('property','name','itemprop'):
            tag=soup.find('meta',attrs={attr:k})
            if tag and tag.get('content'):
                return normal(tag['content'])
    return ''


def correct_url(href:str)->str|None:
    if not href:return None
    url=urljoin(BASE,href.split('#')[0])
    p=urlparse(url)
    if p.hostname not in ('www.eltribuno.com','eltribuno.com'):return None
    path=p.path.lower().rstrip('/')
    if '/ttag/' in path or '/rss' in path or not re.search(r'/20\d\d[-/]',path):return None
    return url


def page_links(soup:BeautifulSoup)->list[tuple[str,str]]:
    """Use only URLs present on the tag page, not related-article suggestions."""
    results=[];seen=set()
    # First take article headings; fallback to anchor text if the CMS changes markup.
    for h in soup.select('h2, h3'):
        a=h.find('a',href=True) or h.find_parent('a',href=True)
        if not a:continue
        url=correct_url(a.get('href',''))
        title=normal(h.get_text(' ',strip=True))
        if url and len(title)>=18 and url not in seen:
            seen.add(url);results.append((url,title))
    if len(results)<5:
        for a in soup.find_all('a',href=True):
            url=correct_url(a.get('href',''))
            title=normal(a.get_text(' ',strip=True))
            if url and len(title)>=28 and url not in seen:
                seen.add(url);results.append((url,title))
    return results


def walk_jsonld(value):
    if isinstance(value,list):
        for v in value:yield from walk_jsonld(v)
    elif isinstance(value,dict):
        yield value
        for k in ('@graph','mainEntity','itemListElement'):
            if k in value:yield from walk_jsonld(value[k])


def parse_date(raw)->str|None:
    if isinstance(raw,list):raw=next((x for x in raw if isinstance(x,str)),None)
    if not isinstance(raw,str):return None
    try:
        val=dt.datetime.fromisoformat(raw.replace('Z','+00:00'))
        if val.tzinfo is None:val=val.replace(tzinfo=TZ)
        return val.astimezone(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    except ValueError:return None


def article_info(url:str,title_from_tag:str)->dict|None:
    soup=get_soup(url)
    schema=[]
    for tag in soup.find_all('script',type=re.compile(r'ld\+json',re.I)):
        try:schema.extend(walk_jsonld(json.loads(tag.string or tag.get_text())))
        except (ValueError,TypeError):continue
    news=[d for d in schema if any(x in str(d.get('@type','')) for x in ('NewsArticle','Article','BlogPosting'))]
    obj=news[0] if news else {}
    title=normal(obj.get('headline') if isinstance(obj.get('headline'),str) else None) or meta(soup,'og:title','twitter:title') or title_from_tag
    title=re.sub(r'\s+[|\-]\s+El Tribuno.*$','',title,flags=re.I)
    summary=normal(obj.get('description') if isinstance(obj.get('description'),str) else None) or meta(soup,'description','og:description','twitter:description')
    if len(summary)>450:summary=summary[:447].rstrip()+'…'
    img=obj.get('image')
    if isinstance(img,list):img=next((x for x in img if isinstance(x,(str,dict))),None)
    if isinstance(img,dict):img=img.get('url') or img.get('contentUrl')
    if not isinstance(img,str):img=''
    img=img or meta(soup,'og:image','twitter:image')
    if img:img=urljoin(url,img)
    if img and urlparse(img).scheme not in ('http','https'):img=''
    published=(parse_date(obj.get('datePublished')) or parse_date(meta(soup,'article:published_time','datePublished','date','pubdate')))
    if not published:
        time_tag=soup.select_one('time[datetime]')
        if time_tag:published=parse_date(time_tag.get('datetime'))
    # Dates and times must come from actual article metadata; no fabricated hour.
    if not published:LOG.warning('Sin fecha verificable: %s',url)
    return {'url':url,'title':title,'summary':summary,'image':img,'published_at':published}


def main():
    logging.basicConfig(level=logging.INFO,format='%(levelname)s %(message)s')
    urls=[]
    seen=set()
    successful_sources=0
    for tag_url in SOURCES:
        try:
            candidates=page_links(get_soup(tag_url))
            successful_sources+=1
            LOG.info('Etiqueta %s: %d enlaces',tag_url,len(candidates))
            for url,title in candidates:
                key=url.rstrip('/')
                if key not in seen:
                    seen.add(key)
                    urls.append((url,title))
        except requests.RequestException as exc:
            LOG.warning('No se pudo acceder a la etiqueta %s: %s',tag_url,exc)
    LOG.info('Noticias candidatas únicas: %d (etiquetas accesibles: %d)',len(urls),successful_sources)
    if not urls:raise RuntimeError('Ninguna etiqueta devolvió enlaces de noticias: se conservan los datos anteriores.')
    items=[]
    # Review extra candidates to ensure five parseable articles.
    for url,title in urls[:20]:
        try:
            item=article_info(url,title)
            if item and item['published_at']:items.append(item)
        except requests.RequestException as exc:LOG.warning('No se pudo leer %s: %s',url,exc)
        time.sleep(.12)
    items.sort(key=lambda x:x['published_at'],reverse=True)
    items=items[:5]
    if len(items)==0:raise RuntimeError('Sin noticias con hora verificada: se conservan los datos anteriores.')
    payload={'updated_at':dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z'),'source':SOURCE,'sources':SOURCES,'items':items}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    tmp=OUT.with_suffix('.tmp');tmp.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');tmp.replace(OUT)
    LOG.info('Escritas %s noticias en %s',len(items),OUT)

if __name__=='__main__':
    try:main()
    except Exception as e:
        LOG.exception('Actualización fallida; no se sobrescribe el JSON existente: %s',e)
        sys.exit(1)
