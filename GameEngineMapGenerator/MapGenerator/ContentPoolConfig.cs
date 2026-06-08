using System;
using System.Collections.Generic;

namespace Hex.MapGenerator
{
	[Serializable]
	public class ContentPoolConfig
	{
		[Serializable]
		public class Group
		{
			public float weight;

			public string[] includeLists;

			public List<ContentWeight> content;
		}

		public string name;

		public ValueDistributionConfig valueDistribution;

		public List<Group> groups;

		public List<ContentID> bans;
	}
}
