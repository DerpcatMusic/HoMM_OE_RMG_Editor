using System;
using UnityEngine;

namespace Hex.MapGenerator;

public static class MapShape
{
	public static void CreateNullZoneMapBorder(ZoneMap zoneMap, MapDescription mapDesc, Vector2Int mapSize)
	{
		for (int i = 0; i < mapSize.x * mapSize.y; i++)
		{
			if (DistanceToBorder(GridUtils.IndexToCoords(i, mapSize), mapSize, mapDesc, waterOnly: false) > 0f)
			{
				zoneMap.Set(i, byte.MaxValue);
			}
		}
	}

	public static float DistanceToBorder(Vector2Int coords, Vector2Int mapSize, MapDescription mapDesc, bool waterOnly)
	{
		Border border = mapDesc.border;
		Vector2 vector = (Vector2)mapSize * 0.5f - Vector2.one * 0.5f;
		Vector2 p = coords - vector;
		float r = (Mathf.Min(vector.x, vector.y) - 1f) * Mathf.Clamp01(border.cornerRadius);
		float num = Mathf.Atan2(p.x, p.y) + (float)Math.PI;
		float num2 = SdRoundedBox(p, vector, r) + (float)border.waterWidth * (1f + Noise(num, border.waterNoise, mapDesc.seed));
		if (waterOnly)
		{
			return num2;
		}
		float b = num2 + (float)border.obstaclesWidth * (1f + Noise(num + 100f, border.obstaclesNoise, mapDesc.seed));
		return Mathf.Max(num2, b);
	}

	private static float SdRoundedBox(Vector2 p, Vector2 b, float r)
	{
		Vector2 lhs = new Vector2(Mathf.Abs(p.x) + r, Mathf.Abs(p.y) + r) - b;
		return Mathf.Min(Mathf.Max(lhs.x, lhs.y), 0f) + Vector2.Max(lhs, Vector2.zero).magnitude - r;
	}

	private static float Noise(float x, Border.NoiseMode[] modes, int seed)
	{
		float num = 0f;
		for (int i = 0; i < modes.Length; i++)
		{
			Border.NoiseMode noiseMode = modes[i];
			num += Noise(x + (float)(i * 100), noiseMode.freq, seed) * noiseMode.amp;
		}
		return num;
	}

	private static float Noise(float x, float freq, int seed)
	{
		return (Mathf.PerlinNoise(x * freq + NoiseOffset(seed) * 100f, 0f) - 0.5f) * 2f;
	}

	private static float NoiseOffset(int seed)
	{
		uint num = (uint)((seed < 0) ? (-seed) : seed);
		uint num2 = 1103515245 * num;
		return (float)((double)(num2 ^ (num2 >> 16)) * 1.0 / 4294967295.0);
	}
}
