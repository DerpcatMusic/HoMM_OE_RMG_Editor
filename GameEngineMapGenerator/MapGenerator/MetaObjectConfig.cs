using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class MetaObjectConfig
	{
		public string sid;

		public int value;

		public int guardValue;

		public string type;

		public string[] args;
	}
}
