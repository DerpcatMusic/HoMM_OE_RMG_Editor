using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhInfoGroups : BhInfoView
	{
		[SerializeField]
		private Toggle replaceToggle;

		[SerializeField]
		private Slider sizeSlider;

		[SerializeField]
		private Slider opacitySlider;

		[SerializeField]
		private TextMeshProUGUI size;

		[SerializeField]
		private TextMeshProUGUI opacity;

		private int buqi;

		private int buqj;

		private bool buqk;

		public void UpdateBrushSize(Slider _slider)
		{
		}

		public void UpdateVals()
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
