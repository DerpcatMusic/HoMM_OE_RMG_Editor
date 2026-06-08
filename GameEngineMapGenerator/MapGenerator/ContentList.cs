using System;
using System.Collections.Generic;

namespace Hex.MapGenerator
{
	[Serializable]
	public class ContentList
	{
		public string name;

		public List<ContentWeight> content;
	}
}
