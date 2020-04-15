#!/usr/bin/env bash

(
  shopt -s extglob

  domain=.$CERTBOT_DOMAIN
  infix=${domain%.$DEDYN_NAME}
  infix=${infix#.\*}

  echo $infix
)
