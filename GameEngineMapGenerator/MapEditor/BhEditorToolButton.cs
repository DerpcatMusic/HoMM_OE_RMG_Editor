using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhEditorToolButton : MonoBehaviour, IPointerClickHandler, IEventSystemHandler
	{
		[SerializeField]
		private Image pic;

		[SerializeField]
		private EEditorTools tools;

		[SerializeField]
		private CanvasGroup selectedCg;

		[SerializeField]
		private BhEditorToolsGroup group;

		[SerializeField]
		private BhInfoView infoView;

		private bool bupz;

		private bool buqa;

		public bool cmot
		{
			get
			{
				return false;
			}
			set
			{
			}
		}

		public EEditorTools cmou => default(EEditorTools);

		private void Awake()
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
