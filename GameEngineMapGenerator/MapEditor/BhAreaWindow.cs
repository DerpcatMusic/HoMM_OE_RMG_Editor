using System.Collections.Generic;
using Hex.UI;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhAreaWindow : BhScreenElement
	{
		[SerializeField]
		private bwv nodeViewer;

		[SerializeField]
		private BhAreaItemView prefab;

		[SerializeField]
		private RectTransform rect;

		[SerializeField]
		private TextMeshProUGUI label;

		private List<BhAreaItemView> buuw;

		private List<BhAreaItemView> buux;

		private Dictionary<int, BhAreaItemView> buuy;

		private bool buuz;

		public bwv cmpc => null;

		private void Start()
		{
		}

		public void UpdateView()
		{
		}

		public override void Show()
		{
		}

		public override void Hide()
		{
		}

		private void Clear()
		{
		}
	}
}
