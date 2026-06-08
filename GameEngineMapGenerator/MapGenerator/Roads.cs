using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator
{
	public static class Roads
	{
		private struct RoadTargets
		{
			public bool isPlaced;

			public int pos;

			public int fallbackPos;

			public readonly int Count;

			public int mrh(int a)
			{
				return 0;
			}

			public RoadTargets(bool isPlaced, int pos, int fallbackPos)
			{
				this.isPlaced = false;
				this.pos = 0;
				this.fallbackPos = 0;
				Count = 0;
			}

			public RoadTargets(bool isPlaced, int pos)
			{
				this.isPlaced = false;
				this.pos = 0;
				fallbackPos = 0;
				Count = 0;
			}

			public RoadTargets(int pos)
			{
				isPlaced = false;
				this.pos = 0;
				fallbackPos = 0;
				Count = 0;
			}
		}

		private class bmm : bol<int>
		{
			private const int btsg = 5000;

			private const int btsh = 50;

			private byte[] btsi;

			private int[] btsj;

			private readonly Vector2Int btsk;

			public int cmlm => 0;

			public int cmln => 0;

			public bmm(byte[] a, bnl b, ReadOnlyArray<Gate> c, ReadOnlyArray<ObstacleState> d, Vector2Int e)
			{
			}

			public int mmz(int a, int b, int c, int d)
			{
				return 0;
			}
		}

		private sealed class bmn
		{
			public ReadOnlyArray<ObstacleState> btsl;

			internal bool mri(int a)
			{
				return false;
			}

			internal bool nyn(int a)
			{
				return false;
			}

			internal bool jht(int a)
			{
				return false;
			}

			internal bool jd(int a)
			{
				return false;
			}

			internal bool kgp(int a)
			{
				return false;
			}
		}

		[StructLayout((LayoutKind)3)]
		[CompilerGenerated]
		private struct _003C_003Ec__DisplayClass2_0
		{
			public ReadOnlyArray<bmy> partitions;

			public Vector2Int mapSize;

			public ReadOnlyArray<Gate> gates;
		}

		[StructLayout((LayoutKind)3)]
		[CompilerGenerated]
		private struct _003C_003Ec__DisplayClass3_0
		{
			public bmy partitionData;

			public Vector2Int mapSize;

			public ReadOnlyArray<Gate> gates;

			public int zoneID;

			public List<Encounter> encounters;

			public int[] encounterByConnection;
		}

		[StructLayout((LayoutKind)3)]
		[CompilerGenerated]
		private struct _003C_003Ec__DisplayClass4_0
		{
			public ReadOnlyArray<bmy> partitions;

			public Vector2Int mapSize;

			public ReadOnlyArray<Gate> gates;

			public ReadOnlyArray<blk> encounters;
		}

		private static ProfilerMarker btsm;

		public static void mrj(out byte[] a, out bom<int> b, ReadOnlyArray<Gate> c, ReadOnlyArray<ObstacleState> d, bnl e, Vector2Int f)
		{
			a = null;
			b = null;
		}

		public static void mrk(byte[] a, bom<int> b, bnl c, Vector2Int d, ReadOnlyArray<bmy> e, ReadOnlyArray<Gate> f)
		{
		}

		public static void mrl(byte[] a, bom<int> b, bnl c, bmy d, List<Encounter> e, int[] f, ReadOnlyArray<Gate> g, int h, Vector2Int i)
		{
		}

		public static void mrm(byte[] a, bom<int> b, bnl c, Vector2Int d, ReadOnlyArray<blk> e, ReadOnlyArray<bmy> f, ReadOnlyArray<Gate> g)
		{
		}

		private static RoadTargets mrn(bool a, Encounter b, Vector2Int c)
		{
			return default(RoadTargets);
		}

		private static void mro(byte[] a, RoadType b, RoadTargets c, RoadTargets d, List<int> e, bom<int> f)
		{
		}

		[CompilerGenerated]
		internal static RoadTargets mrp(int a, RoadTargetType b, int c, ref _003C_003Ec__DisplayClass2_0 d)
		{
			return default(RoadTargets);
		}

		[CompilerGenerated]
		internal static RoadTargets mrq(RoadTargetType a, int b, ref _003C_003Ec__DisplayClass3_0 c)
		{
			return default(RoadTargets);
		}

		[CompilerGenerated]
		internal static RoadTargets mrr(int a, RoadTargetType b, int c, ref _003C_003Ec__DisplayClass4_0 d)
		{
			return default(RoadTargets);
		}
	}
}
