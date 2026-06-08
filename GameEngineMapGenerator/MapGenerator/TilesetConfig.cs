using System;
using UnityEngine;

namespace Hex.MapGenerator
{
	[Serializable]
	public class TilesetConfig
	{
		[Serializable]
		public class Tile
		{
			public string name;

			[NonReorderable]
			public string[] sids;

			public float weight;

			[NonReorderable]
			public TileRuleDesc[] rules;
		}

		public string sid;

		public float weight;

		[Range(0f, 1f)]
		public float skirtFill;

		[NonReorderable]
		public string[] tags;

		public Tile[] obstacles;

		public Tile[] skirt;
	}
}
