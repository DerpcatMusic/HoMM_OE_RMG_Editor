using Hex.Configs;
using Hex.Map;

namespace Hex.MapGenerator
{
	public struct MapObjectDesc
	{
		public readonly ObjectConfig mapConfig;

		public readonly ObjConfigBase logicConfig;

		public readonly int variant;

		public readonly bjm metaObjectDesc;

		public string cmkp => null;

		public bool cmkq => false;

		public MapObjectDesc(ObjectConfig mapConfig, ObjConfigBase logicConfig, int variant, bjm metaObjectDesc)
		{
			this.mapConfig = null;
			this.logicConfig = null;
			this.variant = 0;
			this.metaObjectDesc = null;
		}
	}
}
