using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;

namespace Hex.MapEditor
{
	public class BhEditorListSubButton : MonoBehaviour, IPointerClickHandler, IEventSystemHandler
	{
		[SerializeField]
		private bsj group;

		[SerializeField]
		private BhEditorItemsListView view;

		[SerializeField]
		private CanvasGroup selectedCg;

		[SerializeField]
		private TextMeshProUGUI tagTxt;

		private ESubButtonType bupv;

		private string bupw;

		private bool bupx;

		public string cmor
		{
			get
			{
				return null;
			}
			set
			{
			}
		}

		public bool cmos
		{
			get
			{
				return false;
			}
			set
			{
			}
		}

		public void Show()
		{
		}

		public void Hide()
		{
		}

		private void UpdateView()
		{
		}

		public void OnPointerClick(PointerEventData eventData)
		{
		}

		public void SetUp(string _tag, bsj _group, BhEditorItemsListView _view, ESubButtonType _subButtonType)
		{
		}
	}
}
