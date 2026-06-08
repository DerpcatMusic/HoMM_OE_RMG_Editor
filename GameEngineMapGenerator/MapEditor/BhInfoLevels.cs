using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhInfoLevels : BhInfoView
	{
		[SerializeField]
		private Slider sizeSlider;

		[SerializeField]
		private Slider levelSlider;

		[SerializeField]
		private TextMeshProUGUI size;

		[SerializeField]
		private TextMeshProUGUI level;

		private int buqm;

		private int buqn;

		private bool buqo;

		public void UpdateBrushSize(Slider _slider)
		{
		}

		public void UpdateLevel()
		{
		}

		public override void Show()
		{
		}

		public override void Hide()
		{
		}

		public override void UpdateVal()
		{
		}
	}
}
