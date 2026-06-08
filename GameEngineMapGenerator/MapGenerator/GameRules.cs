using System;
using Hex.Map;

namespace Hex.MapGenerator
{
	[Serializable]
	public class GameRules
	{
		public int heroCountMin;

		public int heroCountMax;

		public int heroCountIncrement;

		public bool heroHireBan;

		public bool encounterHoles;

		public bool disableFactionLaws;

		public bool disableMagicGuild;

		public bool disableMagicCustomLearning;

		public bool tournamentRules;

		public string customAI;

		public float factionLawsExpModifier;

		public float astrologyExpModifier;

		public MapBonus[] bonuses;

		public WinConditions winConditions;
	}
}
