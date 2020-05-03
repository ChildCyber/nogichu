#!/bin/bash
mongoimport -d nogi -c member --drop --jsonArray < /docker-entrypoint-initdb.d/members.json &&
mongoimport -d nogi -c photos --drop --jsonArray < /docker-entrypoint-initdb.d/member-photo.json
