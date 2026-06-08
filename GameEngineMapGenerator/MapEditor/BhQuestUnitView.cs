using Hex.Configs;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhQuestUnitView : MonoBehaviour, bst
	{
		[SerializeField]
		private RectTransform rect;

		[SerializeField]
		private GameObject plus;

		[SerializeField]
		private GameObject portrait;

		[SerializeField]
		private GameObject cross;

		[SerializeField]
		private Image pic;

		[SerializeField]
		private TextMeshProUGUI title;

		[SerializeField]
		private bso propertiesBase;

		private int buxl;

		private UnitViewConfig buxm;

		private bool buxn;

		private int buxo;

		public bool nwz(out string a, out int b)
		{
			a = null;
			b = default(int);
			return false;
		}

		public void OnClick()
		{
		}

		public void kcd(UnitViewConfig a, int b = 0)
		{
		}

		public void ResetState()
		{
		}

		public void kce()
		{
		}

		public void kcf()
		{
		}
	}
}
