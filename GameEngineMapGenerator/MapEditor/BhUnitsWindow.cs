using System.Collections.Generic;
using Hex.Configs;
using Hex.UI;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhUnitsWindow : BhScreenElement
	{
		public static BhUnitsWindow me;

		[SerializeField]
		private GameObject spawnRoot;

		[SerializeField]
		private TMP_Dropdown fractions;

		[SerializeField]
		private TMP_Dropdown tiers;

		[SerializeField]
		private TMP_InputField inputField;

		[SerializeField]
		private RectTransform rect;

		[SerializeField]
		private BhUnitsWindowItem prefab;

		[SerializeField]
		private bool isMovable;

		private List<BhUnitsWindowItem> buyk;

		private float buyl;

		private bst buym;

		private bool buyn;

		public void Start()
		{
		}

		public void PickUnit(UnitViewConfig _unitViewConfig)
		{
		}

		public void nyi()
		{
		}

		public void Show(bst _unitSlot, RectTransform _targetRect, bool _startFromLeftBtm = false)
		{
		}

		public override void Hide()
		{
		}

		private void nyj()
		{
		}

		public void RefreshList()
		{
		}
	}
}
