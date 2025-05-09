# Build the project
yarn build

NAME="calendar"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../out" && pwd )"

aws s3 sync $DIR s3://gen.co/$NAME/ --acl=public-read \
  --exclude ".DS_Store" \
  --exclude ".git/*"

aws cloudfront create-invalidation --distribution-id EXW76U2SHH4YQ --paths /$NAME/ /$NAME/index.html /$NAME/index.txt
