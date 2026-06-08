using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class GeneratorSettings
	{
		[Serializable]
		public class StringPair
		{
			public string key;

			public string val;
		}

		public MetaObjectConfig[] metaObjects;

		public string[] portals;

		public StringPair[] waterForBiome;

		public StringPair[] resourceByMine;
	}
}
