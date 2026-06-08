using System;
using UnityEngine;

namespace Hex.MapGenerator
{
	[Serializable]
	public class EnvironmentAssets
	{
		[Serializable]
		public class BiomeConfig
		{
			public string sid;

			[Range(0f, 1f)]
			public TilesetConfig[] tilesets;

			public TilesetConfig walkable;

			public TilesetConfig water;
		}

		public BiomeConfig[] biomes;
	}
}
