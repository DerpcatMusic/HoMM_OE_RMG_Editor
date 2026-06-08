using System;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhMapBonusesView : MonoBehaviour
	{
		private const int bunm = 20;

		[SerializeField]
		private RectTransform root;

		[SerializeField]
		private BhMapBonusView prefab;

		private Action<BhMapBonusView> bunn;

		private Action<BhMapBonusView> buno;

		private bool bunp;

		private cmr<BhMapBonusView> bunq;

		private List<BhMapBonusView> bunr;

		public void Init(Action<BhMapBonusView> _onSelectAction, Action<BhMapBonusView> _onDeleteAction, bool _showInReverseOrder)
		{
		}

		public void Show(IEnumerable<bsa> _bonuses)
		{
		}

		public void Hide()
		{
		}

		public void nnf(bsa a)
		{
		}

		public void Remove(BhMapBonusView _view)
		{
		}

		private BhMapBonusView nng()
		{
			return null;
		}
	}
}
