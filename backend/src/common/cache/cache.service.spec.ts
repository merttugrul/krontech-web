import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService } from '../../redis/redis.service';

describe('CacheService', () => {
  let service: CacheService;
  let redis: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delPattern: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CacheService);
    redis = module.get(RedisService);
  });

  describe('getOrSet', () => {
    it('cache HIT → loader çağrılmaz', async () => {
      redis.get.mockResolvedValue({ cached: true });
      const loader = jest.fn();

      const result = await service.getOrSet('key', loader);

      expect(result).toEqual({ cached: true });
      expect(loader).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    it("cache MISS → loader çağrılır + sonuç cache'lenir", async () => {
      redis.get.mockResolvedValue(null);
      const loader = jest.fn().mockResolvedValue({ fresh: true });

      const result = await service.getOrSet('key', loader, 60);

      expect(result).toEqual({ fresh: true });
      expect(loader).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledWith('key', { fresh: true }, 60);
    });

    it('ttl verilmezse default 300sn kullanılır', async () => {
      redis.get.mockResolvedValue(null);
      await service.getOrSet('k', async () => 'v');
      expect(redis.set).toHaveBeenCalledWith('k', 'v', 300);
    });
  });

  describe('invalidateNamespace', () => {
    it('"products" namespace → delPattern("products:*")', async () => {
      redis.delPattern.mockResolvedValue(5);
      const removed = await service.invalidateNamespace('products');
      expect(redis.delPattern).toHaveBeenCalledWith('products:*');
      expect(removed).toBe(5);
    });
  });

  describe('invalidateNamespaces', () => {
    it('her namespace için delPattern paralel çağrılır', async () => {
      redis.delPattern.mockResolvedValue(0);
      await service.invalidateNamespaces(['products', 'sitemap']);
      expect(redis.delPattern).toHaveBeenCalledTimes(2);
      expect(redis.delPattern).toHaveBeenCalledWith('products:*');
      expect(redis.delPattern).toHaveBeenCalledWith('sitemap:*');
    });
  });

  describe('passthroughlar', () => {
    it('set → redis.set', async () => {
      await service.set('k', 'v', 60);
      expect(redis.set).toHaveBeenCalledWith('k', 'v', 60);
    });

    it('get → redis.get', async () => {
      redis.get.mockResolvedValue('hit');
      expect(await service.get('k')).toBe('hit');
    });

    it('del → redis.del', async () => {
      await service.del('k');
      expect(redis.del).toHaveBeenCalledWith('k');
    });
  });
});
