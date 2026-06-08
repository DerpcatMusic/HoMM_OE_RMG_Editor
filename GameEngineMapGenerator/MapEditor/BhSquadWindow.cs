using System.Collections.Generic;
using Hex.Configs;
using Hex.UI;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhSquadWindow : BhScreenElement
	{
		public static BhSquadWindow me;

		[SerializeField]
		private GameObject spawnRoot;

		[SerializeField]
		private TMP_Dropdown fractions;

		[SerializeField]
		private TMP_Dropdown tiers;

		[SerializeField]
		private RectTransform rect;

		[SerializeField]
		private BhSquadWindowItem prefab;

		[SerializeField]
		private bool isMovable;

		private List<BhSquadWindowItem> buyd;

		private float buye;

		private BhPropertiesSquad buyf;

		private bool buyg;

		private bool buyh;

		public void Start()
		{
		}

		public void PickUnit(SquadConfig _unitViewConfig)
		{
		}

		public void Show(BhPropertiesSquad _squadSlot, RectTransform _targetRect, bool _startFromLeftBtm = false)
		{
		}

		public override void Hide()
		{
		}

		private void nyh()
		{
		}

		public void RefreshList()
		{
		}
	}
}
