using UnityEngine;
using UnityEngine.EventSystems;

namespace Hex.MapEditor
{
	public class BhEditorListMasterButton : MonoBehaviour, IPointerClickHandler, IEventSystemHandler
	{
		public static BhEditorListMasterButton me;

		[SerializeField]
		private BhEditorListMasterButtonsGroup group;

		[SerializeField]
		private BhEditorItemsListView view;

		[SerializeField]
		private CanvasGroup subCg;

		[SerializeField]
		private CanvasGroup selectedCg;

		[SerializeField]
		private BhInfoView infoView;

		[SerializeField]
		private bsi panelLogic;

		private bool bups;

		private bool bupt;

		public bool cmoq
		{
			get
			{
				return false;
			}
			set
			{
			}
		}

		private void Awake()
		{
		}

		public void Show()
		{
		}

		public void Hide()
		{
		}

		public void npf()
		{
		}

		public void npg()
		{
		}

		private void UpdateView()
		{
		}

		public void OnPointerClick(PointerEventData eventData)
		{
		}
	}
}
