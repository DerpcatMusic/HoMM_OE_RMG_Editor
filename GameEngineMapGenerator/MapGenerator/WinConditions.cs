using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class WinConditions
	{
		public bool classic;

		public bool desertion;

		public bool heroLighting;

		public bool lostStartCity;

		public bool lostStartHero;

		public bool gladiatorArena;

		public bool cityHold;

		public bool tournament;

		public int desertionDay;

		public int desertionValue;

		public int heroLightingDay;

		public int lostStartCityDay;

		public bool gladiatorArenaRegistrationStartWork;

		public bool gladiatorArenaRegistrationStartFight;

		public int gladiatorArenaDaysDelayStart;

		public int gladiatorArenaCountDay;

		public string championSelectRule;

		public int cityHoldDays;

		public int tournamentPointsToWin;

		public bool tournamentSaveArmy;

		public int[] tournamentDays;

		public int[] tournamentAnnounceDays;
	}
}
