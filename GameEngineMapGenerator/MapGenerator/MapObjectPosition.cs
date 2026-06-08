namespace Hex.MapGenerator
{
	public struct MapObjectPosition
	{
		public int tile;

		public int rotation;

		public int level;

		public MapObjectPosition(int tile, int rotation, int level)
		{
			this.tile = 0;
			this.rotation = 0;
			this.level = 0;
		}

		public MapObjectPosition(int tile, int rotation)
		{
			this.tile = 0;
			this.rotation = 0;
			level = 0;
		}

		public MapObjectPosition(int tile)
		{
			this.tile = 0;
			rotation = 0;
			level = 0;
		}
	}
}
