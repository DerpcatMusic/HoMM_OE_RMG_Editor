using System;
using System.Collections.Generic;

namespace Hex.MapGenerator
{
	[Serializable]
	public class ContentCountLimit
	{
		public string[] includeLists;

		public List<ContentID> content;

		public string sid;

		public int variant;

		public string biome;

		public int maxCount;
	}
}
