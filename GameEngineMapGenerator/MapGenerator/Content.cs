using Hex.Map;

namespace Hex.MapGenerator
{
	public struct Content
	{
		public MapObjectDesc objectDesc;

		public ESpawn? owner;

		public int value;

		public int guardValue;

		public bool canBeMoved;

		public bka pool;

		public bool cmlb => false;

		public Content(MapObjectDesc objectDesc, ESpawn? owner, int value, int guardValue, bool canBeMoved, bka pool)
		{
			this.objectDesc = default(MapObjectDesc);
			this.owner = null;
			this.value = 0;
			this.guardValue = 0;
			this.canBeMoved = false;
			this.pool = null;
		}

		public static Content mfb(MapObjectDesc a, int b, int c, bool d, bka e)
		{
			return default(Content);
		}

		public static Content mfc(MapObjectDesc a, ESpawn? b, int c, int d, bool e)
		{
			return default(Content);
		}

		public static Content mfd(int a, int b)
		{
			return default(Content);
		}
	}
}
