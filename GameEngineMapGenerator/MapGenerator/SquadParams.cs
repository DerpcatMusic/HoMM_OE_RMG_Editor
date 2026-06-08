using Hex.Configs;

namespace Hex.MapGenerator
{
	public struct SquadParams
	{
		public int value;

		public float weeklyIncrement;

		public bool isMain;

		public SquadConfig squadConfig;

		public ESquadReactionType disposition;

		public float diplomacyModifier;

		public bool escape;

		public static SquadParams mih(int a, float b, ESquadReactionType c, bool d, SquadConfig e)
		{
			return default(SquadParams);
		}

		public static SquadParams mii(int a, float b, float c, ESquadReactionType d)
		{
			return default(SquadParams);
		}

		public static SquadParams mij(int a, float b)
		{
			return default(SquadParams);
		}
	}
}
