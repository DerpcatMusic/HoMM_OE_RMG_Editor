using System;
using System.Collections.Generic;
using Hex.UI.GeneralKit;
using TMPro;
using UIAnimator;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhMapBonusView : MonoBehaviour
	{
		[SerializeField]
		private UiAnimatorPrime uiAnimator;

		[SerializeField]
		private Image icon;

		[SerializeField]
		private TextMeshProUGUI nameTxt;

		[SerializeField]
		private TextMeshProUGUI descTxt;

		[SerializeField]
		private BhDropdown sideDropdown;

		[SerializeField]
		private BhDropdown receiverDropdown;

		[SerializeField]
		private List<BhMapBonusParameterView> parameterViews;

		private Action<BhMapBonusView> bunt;

		private Action<BhMapBonusView> bunu;

		private bool bunv;

		private bsa bunw;

		public bsa cmog => null;

		public void Init(Action<BhMapBonusView> _onSelectAction, Action<BhMapBonusView> _onDeleteAction)
		{
		}

		public void Show(bsa _editorMapBonus)
		{
		}

		public void Hide()
		{
		}

		public void OnEnter()
		{
		}

		public void OnExit()
		{
		}

		public void OnSelectButton()
		{
		}

		public void OnDeleteButton()
		{
		}

		public void OnChangeSideDropdown()
		{
		}

		public void OnChangeReceiverDropdown()
		{
		}

		private void nni()
		{
		}

		private void nnj()
		{
		}

		private void nnk()
		{
		}
	}
}
