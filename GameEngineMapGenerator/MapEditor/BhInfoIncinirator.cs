using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhInfoIncinirator : BhInfoView
	{
		[SerializeField]
		private Slider sizeSlider;

		[SerializeField]
		private Toggle mapObj;

		[SerializeField]
		private Toggle units;

		[SerializeField]
		private Toggle roads;

		[SerializeField]
		private Toggle rivers;

		[SerializeField]
		private Toggle cliffs;

		[SerializeField]
		private Toggle markers;

		[SerializeField]
		private TextMeshProUGUI size;

		private int buql;

		public void UpdateBrushSize(Slider _slider)
		{
		}

		public void UpdateToggles()
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
