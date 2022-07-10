#!/bin/bash
mongoimport -d nogi -c member --drop --jsonArray < /docker-entrypoint-initdb.d/members.json &&
mongoimport -d nogi -c photos --drop --jsonArray < /docker-entrypoint-initdb.d/member-photo.json &&
mongoimport -d nogi -c blog --drop --jsonArray < /docker-entrypoint-initdb.d/blog-2019.json &&
mongoimport -d nogi -c blog --drop --jsonArray < /docker-entrypoint-initdb.d/blog-2020.json &&
mongoimport -d nogi -c blog --drop --jsonArray < /docker-entrypoint-initdb.d/blog-2021.json