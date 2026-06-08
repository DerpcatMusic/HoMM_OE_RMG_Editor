using System;
using System.Collections.Generic;
using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;
using UnityEngine;

namespace Hex.MapGenerator;

public static class KMeans
{
	[BurstCompile(CompileSynchronously = true)]
	private struct KMeansJob : IJobParallelFor
	{
		public NativeArray<int> result;

		[ReadOnly]
		public NativeArray<Vector2> dataPoints;

		[ReadOnly]
		public NativeArray<Vector2> means;

		public void Execute(int i)
		{
			Vector2 vector = dataPoints[i];
			float num = float.MaxValue;
			int value = -1;
			for (int j = 0; j < means.Length; j++)
			{
				float sqrMagnitude = (vector - means[j]).sqrMagnitude;
				if (sqrMagnitude < num)
				{
					num = sqrMagnitude;
					value = j;
				}
			}
			result[i] = value;
		}
	}

	public static Vector2[] Calculate(int iterations, int meansCount, List<Vector2> dataPoints, System.Random random, List<Vector2> initialMeans = null, int fixedMeansCount = 0)
	{
		if (meansCount == 1)
		{
			Vector2 vector = Utils.Centroid(dataPoints);
			return new Vector2[1] { vector };
		}
		NativeArray<Vector2> means = new NativeArray<Vector2>(meansCount, Allocator.TempJob);
		NativeArray<Vector2> nativeArray = new NativeArray<Vector2>(meansCount, Allocator.TempJob);
		NativeArray<Vector2> nativeArray2 = new NativeArray<Vector2>(dataPoints.Count, Allocator.TempJob);
		NativeArray<int> nativeArray3 = new NativeArray<int>(meansCount, Allocator.TempJob);
		NativeArray<int> result = new NativeArray<int>(dataPoints.Count, Allocator.TempJob);
		for (int i = 0; i < dataPoints.Count; i++)
		{
			nativeArray2[i] = dataPoints[i];
		}
		int num = initialMeans?.Count ?? 0;
		RngUtils.Shuffle(nativeArray2, random);
		for (int j = 0; j < meansCount; j++)
		{
			if (j < num)
			{
				means[j] = initialMeans[j];
			}
			else
			{
				means[j] = nativeArray2[j];
			}
			nativeArray[j] = Vector2.zero;
			nativeArray3[j] = 0;
		}
		for (int k = 0; k < iterations; k++)
		{
			new KMeansJob
			{
				result = result,
				dataPoints = nativeArray2,
				means = means
			}.Schedule(nativeArray2.Length, 16).Complete();
			for (int l = 0; l < nativeArray2.Length; l++)
			{
				int index = result[l];
				nativeArray3[index]++;
				nativeArray[index] += nativeArray2[l];
			}
			for (int m = 0; m < meansCount; m++)
			{
				if (m >= fixedMeansCount && nativeArray3[m] > 0)
				{
					means[m] = nativeArray[m] / nativeArray3[m];
				}
				nativeArray[m] = Vector2.zero;
				nativeArray3[m] = 0;
			}
		}
		Vector2[] result2 = means.ToArray();
		means.Dispose();
		nativeArray.Dispose();
		result.Dispose();
		nativeArray2.Dispose();
		nativeArray3.Dispose();
		return result2;
	}
}
