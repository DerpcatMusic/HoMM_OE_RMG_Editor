using System;
using System.Collections.Generic;
using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;
using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator
{
	public static class Elevation
	{
		[BurstCompile(CompileSynchronously = true)]
		private struct CellularAutomataJob : IJobParallelFor
		{
			public NativeArray<sbyte> result;

			[ReadOnly]
			public NativeArray<sbyte> input;

			[ReadOnly]
			public Vector2Int mapSize;

			[ReadOnly]
			public int createThreshold;

			[ReadOnly]
			public int removeThreshold;

			[ReadOnly]
			public NativeArray<byte> zoneMap;

			public void Execute(int i)
			{
			}
		}

		private class blg
		{
			public List<int>[] btll;

			public int[] btlm;

			public int btln;

			public blg(List<int>[] a, int[] b, int c)
			{
			}
		}

		private class blh
		{
			public readonly byte btlo;

			public readonly sbyte btlp;

			public readonly int[] btlq;

			public readonly List<int> btlr;

			public int cmlg => 0;

			public blh(byte a, sbyte b, int[] c)
			{
			}
		}

		private sealed class bli
		{
			public bmx btls;

			internal byte ncc(int a)
			{
				return 0;
			}

			internal byte mjr(int a)
			{
				return 0;
			}

			internal byte lvo(int a)
			{
				return 0;
			}

			internal byte gjx(int a)
			{
				return 0;
			}

			internal byte npe(int a)
			{
				return 0;
			}
		}

		private static ProfilerMarker btlt;

		private static ProfilerMarker btlu;

		private static ProfilerMarker btlv;

		private static ProfilerMarker btlw;

		private static ProfilerMarker btlx;

		public static void MapElevation(out sbyte[] elevationMap, int zoneCount, System.Random random, bnl mapDesc, Vector2Int mapSize, bmx zoneMap)
		{
			elevationMap = null;
		}

		private static blg[] CalculateSplitData(bnl mapDesc, int zoneCount, Vector2Int mapSize, bmx zoneMap, System.Random random)
		{
			return null;
		}

		private static void CreateElevation(bnl mapDesc, int minSubzoneArea, sbyte[] elevation, blg[] splits, bmx zoneMap, int zoneCount, Vector2Int mapSize, System.Random random)
		{
		}

		private static int mjs(int a, int b, float c, float d, System.Random e)
		{
			return 0;
		}

		private static void Smoothe(sbyte[] elevation, Vector2Int mapSize, bmx zoneMap)
		{
		}

		private static void CleanupSmallPatches(int minSubzoneArea, sbyte[] elevation, Vector2Int mapSize, bmx zoneMap)
		{
		}

		private static void mjt(int a, sbyte[] b, List<blh> c)
		{
		}

		private static List<blh> mju(sbyte[] a, Vector2Int b, bmx c)
		{
			return null;
		}

		private static void mjv(sbyte[] a, bmx b, Vector2Int c)
		{
		}

		private static void mjw(NativeArray<sbyte> a, NativeArray<sbyte> b, int c, int d, Vector2Int e, NativeArray<byte> f)
		{
		}
	}
}
