using UnityEngine;

namespace Hex.MapGenerator
{
	public struct ContentSlot
	{
		public ContentSlotType type;

		public Encounter encounter;

		public int buildingIndex;

		public int pickupIndex;

		public int position;

		public int contentIndex;

		public bool fillerResource;

		public bool meu()
		{
			return false;
		}

		public int mev(Vector2Int a)
		{
			return 0;
		}

		public int mew(Vector2Int a)
		{
			return 0;
		}

		private ContentSlot(ContentSlotType type, Encounter encounter, int buildingIndex, int pickupIndex, int position, int contentIndex, bool fillerResource)
		{
			this.type = default(ContentSlotType);
			this.encounter = default(Encounter);
			this.buildingIndex = 0;
			this.pickupIndex = 0;
			this.position = 0;
			this.contentIndex = 0;
			this.fillerResource = false;
		}

		public static ContentSlot mex(Encounter a, int b)
		{
			return default(ContentSlot);
		}

		public static ContentSlot mey(Encounter a, int b, bool c)
		{
			return default(ContentSlot);
		}

		public static ContentSlot mez(int a)
		{
			return default(ContentSlot);
		}
	}
}
