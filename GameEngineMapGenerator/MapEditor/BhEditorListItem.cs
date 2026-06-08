using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhEditorListItem : MonoBehaviour, IPointerClickHandler, IEventSystemHandler, IPointerEnterHandler, IPointerExitHandler
	{
		[SerializeField]
		private Image icon;

		[SerializeField]
		private GameObject selectedMarker;

		[SerializeField]
		private TextMeshProUGUI title;

		protected int bupn;

		private BhEditorItemsListView bupo;

		private EEditorTypes bupp;

		private string bupq;

		private bool bupr;

		public bool cmop
		{
			get
			{
				return false;
			}
			set
			{
			}
		}

		public void Select()
		{
		}

		public virtual void OnPointerClick(PointerEventData eventData)
		{
		}

		public void OnPointerEnter(PointerEventData pointerEventData)
		{
		}

		public void OnPointerExit(PointerEventData pointerEventData)
		{
		}

		public void SetUp(EEditorTypes _eEditorTypes, int _id, string _title, Sprite _sprite, BhEditorItemsListView _listView = null)
		{
		}
	}
}
