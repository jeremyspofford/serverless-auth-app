#!/usr/bin/env bash

docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml up --build