"""Extract OG images from five *curated* El Tribuno articles.
Run from repo root in GitHub Actions; no changes to update_news.py.
"""
import json
import logging
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

FILE = Path('data/salta-cards.json')
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; ElTribunoEditorialSpecial/1.0)'}

def image_from_article(url):
    response = requests.get(url, headers=HEADERS, timeout=22)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    for attr in ('og:image', 'twitter:image', 'twitter:image:src'):
        tag = soup.find('meta', attrs={'property': attr}) or soup.find('meta', attrs={'name': attr})
        if tag and tag.get('content'):
            image = urljoin(url, tag['content'].strip())
            if image.startswith('https://'):
                return image
    for node in soup.find_all('script', type='application/ld+json'):
        try:
            obj = json.loads(node.string or node.get_text())
        except (ValueError, TypeError):
            continue
        def walk(v):
            if isinstance(v, list):
                for x in v:
                    got = walk(x)
                    if got: return got
            if isinstance(v, dict):
                if v.get('@type') in ('NewsArticle', 'Article', 'ReportageNewsArticle'):
                    im = v.get('image')
                    if isinstance(im, str): return im
                    if isinstance(im, list) and im: return walk(im)
                    if isinstance(im, dict): return im.get('url') or im.get('contentUrl')
                for x in v.values():
                    got = walk(x)
                    if got: return got
            return None
        result = walk(obj)
        if result:
            image = urljoin(url, result)
            if image.startswith('https://'): return image
    return None


def main():
    data = json.loads(FILE.read_text(encoding='utf-8'))
    changed = False
    for item in data['items']:
        url = item['url']
        if urlparse(url).hostname not in {'www.eltribuno.com', 'eltribuno.com'}:
            logging.warning('Skipping unexpected domain %s', url)
            continue
        try:
            pic = image_from_article(url)
        except requests.RequestException as err:
            logging.warning('Cannot retrieve image for %s: %s', url, err)
            continue
        if pic and pic != item.get('image'):
            item['image'] = pic
            changed = True
            logging.info('Found image for %s', item['title'])
        elif not pic:
            logging.warning('No suitable OG image for %s', item['title'])
    if changed:
        FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        logging.info('Saved image metadata')
    else:
        logging.info('No image updates; kept previous data')

if __name__ == '__main__':
    main()
