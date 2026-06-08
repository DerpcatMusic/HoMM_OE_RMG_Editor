using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class RoadConfig
	{
		public string type;

		public RoadTargetConfig from;

		public RoadTargetConfig to;
	}
}
