using System;
using System.Collections;
using System.Collections.Generic;
using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator
{
	public static class Rivers
	{
		private struct RiverMouth
		{
			public int tile;

			public sbyte elevation;

			public int waterTile;

			public int mqw()
			{
				return 0;
			}

			public RiverMouth(int tile, sbyte elevation)
			{
				this.tile = 0;
				this.elevation = 0;
				waterTile = 0;
			}

			public RiverMouth(int tile, sbyte elevation, int waterTile)
			{
				this.tile = 0;
				this.elevation = 0;
				this.waterTile = 0;
			}
		}

		private class bmj : bok, IEnumerator<int>, IEnumerator, IDisposable
		{
			private readonly bml btrl;

			private iw.NeighboursIterator btrm;

			private ObstacleState btrn;

			private bool btro;

			private sbyte btrp;

			public int Current => 0;

			object IEnumerator.Current => null;

			public bool MoveNext()
			{
				return false;
			}

			public bmj(bml a)
			{
			}

			public void Reset()
			{
			}

			public void Dispose()
			{
			}

			private bool mqy(int a)
			{
				return false;
			}

			public IEnumerator<int> mmu(int a)
			{
				return null;
			}

			private bool eob(int a)
			{
				return false;
			}
		}

		private class bmk : bol<int>
		{
			private readonly int[] btrq;

			private readonly byte[] btrr;

			public int cmlm => 0;

			public int cmln => 0;

			public bmk(bml a)
			{
			}

			public int mmz(int a, int b, int c, int d)
			{
				return 0;
			}

			private static int mqz(Vector2Int a, Vector2Int b)
			{
				return 0;
			}

			private static int bks(Vector2Int a, Vector2Int b)
			{
				return 0;
			}
		}

		private class bml
		{
			public Vector2Int btrs;

			public System.Random btrt;

			public bnl btru;

			public bmj btrv;

			public bmk btrw;

			public bom<int> btrx;

			public ReadOnlyArray<ObstacleState> btry;

			public ReadOnlyArray<sbyte> btrz;

			public ReadOnlyArray<byte> btsa;

			public byte[] btsb;

			public bool[] btsc;

			public int[] btsd;

			public int[] btse;
		}

		private static ProfilerMarker btsf;

		public static void mrb(out byte[] a, ReadOnlyArray<ObstacleState> b, ReadOnlyArray<sbyte> c, ReadOnlyArray<byte> d, ReadOnlyArray<Gate> e, bnl f, System.Random g, Vector2Int h)
		{
			a = null;
		}

		private static RiverMouth? mrc(bml a)
		{
			return null;
		}

		private static void mrd(bml a, RiverMouth b)
		{
		}

		private static bool mre(ObstacleState a)
		{
			return false;
		}

		private static bool mrf(ObstacleState a, ObstacleState b)
		{
			return false;
		}

		private static bool[] mrg(ReadOnlyArray<Gate> a, Vector2Int b)
		{
			return null;
		}
	}
}
