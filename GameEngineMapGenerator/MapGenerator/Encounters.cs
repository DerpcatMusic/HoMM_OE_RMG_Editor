using System;
using System.Collections.Generic;
using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator
{
	public static class Encounters
	{
		private class blj
		{
			public ObstacleState[] btly;

			public byte[] btlz;

			public int btma;

			public bnl btmb;

			public bjl btmc;

			public bom<int> btmd;

			public blm btme;

			public Vector2Int btmf;

			public bmx btmg;

			public ReadOnlyArray<Gate> btmh;

			public ReadOnlyArray<bmy> btmi;

			public ReadOnlyArray<bmt> btmj;

			public System.Random btmk;

			public blq btml;

			public blv btmm;
		}

		private struct MandatoryEncounetrsInfo
		{
			public List<int> contentByEncounter;

			public int missingSlots;
		}

		private static ProfilerMarker btmn;

		public static void PlaceEncounters(out blk[] encounters, out blv heatMap, out int missingMandatoryContentSlots, ObstacleState[] obstacles, byte[] roadMap, int zoneCount, System.Random random, bnl mapDesc, bjl contentDatabase, bom<int> roadPathfinder, blm encountersDB, Vector2Int mapSize, bmx zoneMap, ReadOnlyArray<Gate> zoneGates, ReadOnlyArray<bmy> partitionData, ReadOnlyArray<bmt> walkablePoints)
		{
			encounters = null;
			heatMap = null;
			missingMandatoryContentSlots = default(int);
		}

		private static blk mjx(blj a, int b)
		{
			return null;
		}

		private static void mjy(List<Encounter> a, int[] b, blj c, int d, bmi e)
		{
		}

		private static MandatoryEncounetrsInfo mjz(List<Encounter> a, blj b, int c, List<Encounter> d, int[] e)
		{
			return default(MandatoryEncounetrsInfo);
		}

		private static List<Encounter> mka(blj a, int b, bool c, bkj.bki d)
		{
			return null;
		}

		private static Encounter? mkb(ObstacleState[] a, blm.bll b, bmt.Iterator c, int d, blj e)
		{
			return null;
		}

		private static float mkc(int a, int b, bnl c)
		{
			return 0f;
		}
	}
}
