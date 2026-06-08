using Hex.UI;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public sealed class BhHeroesSettings : BhScreenElement
	{
		[SerializeField]
		private TMP_InputField heroCountMinInputField;

		[SerializeField]
		private TMP_InputField heroCountMaxInputField;

		[SerializeField]
		private TMP_InputField heroCountIncrementInputField;

		[SerializeField]
		private Toggle enableHeroHireBanToggle;

		[SerializeField]
		private Toggle enableCustomHeroMaxLevelToggle;

		[SerializeField]
		private TMP_InputField customHeroMaxLevelInputField;

		[SerializeField]
		private Toggle disableAutoBattleAgainstEnemyHeroesToggle;

		public override void Show()
		{
		}

		public override void Hide()
		{
		}

		public void OnChangeValue()
		{
		}

		private void nnb(ref int a, TMP_InputField b)
		{
		}
	}
}
