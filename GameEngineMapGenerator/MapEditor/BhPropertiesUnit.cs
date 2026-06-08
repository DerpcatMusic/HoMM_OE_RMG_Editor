using Hex.Configs;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhPropertiesUnit : MonoBehaviour, bst
	{
		[SerializeField]
		private RectTransform rect;

		[SerializeField]
		private GameObject plus;

		[SerializeField]
		private GameObject portrait;

		[SerializeField]
		private GameObject count;

		[SerializeField]
		private GameObject cross;

		[SerializeField]
		private Image pic;

		[SerializeField]
		private TMP_InputField inputField;

		[SerializeField]
		private TextMeshProUGUI title;

		[SerializeField]
		private bso propertiesBase;

		private int butu;

		private UnitViewConfig butv;

		private bool butw;

		private int butx;

		private const int buty = 10;

		public bool nut(out string a, out int b)
		{
			a = null;
			b = default(int);
			return false;
		}

		public void OnClick()
		{
		}

		public void kcd(UnitViewConfig a, int b = 10)
		{
		}

		public void UpdateStackCount()
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
