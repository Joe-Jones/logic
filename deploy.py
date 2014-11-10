from boto import connect_s3
from boto.s3.key import Key
from config import configs
import sys

if len(sys.argv) > 1 :
  config_name = sys.argv[1]
else :
  config_name = 'test'

config = configs[config_name]

s3 = connect_s3(config['AWS_ACCESS_KEY_ID'], config['AWS_SECRET_ACCESS_KEY'])
bucket = s3.get_bucket(config['bucket'])

# Find out what version number we should create
version_key = Key(bucket)
version_key.key = 'version'
if version_key.exists() :
  version = int(version_key.get_contents_as_string())
  version += 1
else :
  version = 0
  
version_key.set_contents_from_string(str(version))

# upload the files
js_key = Key(bucket)
js_key.key = str(version) + '.js'
js_key.set_metadata('Cache-Control', 'max-age=31536000')
js_key.set_contents_from_filename("logic-compiled.js")
js_key.set_canned_acl('public-read')

css_key = Key(bucket)
css_key.key = str(version) + '.css'
css_key.set_metadata('Cache-Control', 'max-age=31536000')
css_key.set_contents_from_filename("combined.css")
css_key.set_canned_acl('public-read')

f = open("logic-compiled.html")
html = ''.join(f.readlines())
html = html.replace('COMPILEDCSS', str(version) + '.css')
html = html.replace('COMPILEDJS', str(version) + '.js')
html_key = Key(bucket)
html_key.key = 'logic.html'
html_key.set_metadata('Content-Type', 'text/html')
html_key.set_metadata('Cache-Control', 'max-age=60');
html_key.set_contents_from_string(html)
html_key.set_canned_acl('public-read')

