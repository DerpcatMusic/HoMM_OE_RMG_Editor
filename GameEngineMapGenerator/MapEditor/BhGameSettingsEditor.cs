using Hex.UI;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhGameSettingsEditor : BhScreenElement
	{
		public static BhGameSettingsEditor me;

		[SerializeField]
		private BhModeSettings modeSettings;

		[SerializeField]
		private BhTournamentRules tournamentRules;

		[SerializeField]
		private BhAISettings aiSettings;

		[SerializeField]
		private BhSideSettings uniqueMagicsSettings;

		[SerializeField]
		private BhWeekEffectSettings weekEffectSettings;

		[SerializeField]
		private BhScenarioForSingleGame scenarioForSingleGame;

		private void Start()
		{
		}

		public override void Show()
		{
		}

		public override void Hide()
		{
		}
	}
}
