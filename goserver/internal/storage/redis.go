package storage

import "github.com/go-redis/redis/v9"

type RedisClient struct {
	*redis.Client
}

func InitRedis() *RedisClient {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})
	return &RedisClient{
		Client: rdb,
	}
}

func (client *RedisClient)
