using Hex.Configs;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhMapBonusParameterView : MonoBehaviour
	{
		[SerializeField]
		private TextMeshProUGUI labelTxt;

		[SerializeField]
		private TMP_InputField valueInput;

		private BonusOverridenParameter buns;

		public void Init(bool _isInteractable)
		{
		}

		public void Show(BonusOverridenParameter _parameter)
		{
		}

		public void Hide()
		{
		}

		public void OnValueInputChanged()
		{
		}
	}
}
