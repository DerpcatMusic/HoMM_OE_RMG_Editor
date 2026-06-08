using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhInfoObject : BhInfoView
	{
		public static BhInfoObject me;

		[SerializeField]
		private Slider levelSlider;

		[SerializeField]
		private TextMeshProUGUI level;

		[SerializeField]
		private Slider rotSlider;

		[SerializeField]
		private TextMeshProUGUI rotLabel;

		[SerializeField]
		private Toggle mirrorToggle;

		[SerializeField]
		private GameObject rotateRoot;

		[SerializeField]
		private GameObject mirrorRoot;

		private float buqp;

		private byte buqq;

		private bool buqr;

		private Dictionary<int, string> buqs;

		private void Start()
		{
		}

		public void Init(float _level, byte _rotation)
		{
		}

		public void UpdateLevel(Slider _slider)
		{
		}

		public void UpdateRot(Slider _slider)
		{
		}

		public void UpdateToggle()
		{
		}

		public void npy(int a)
		{
		}

		public void npz(bool a)
		{
		}

		public void nqa(bool a)
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
