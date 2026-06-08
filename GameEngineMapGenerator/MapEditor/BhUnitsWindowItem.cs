using Hex.Configs;
using Hex.Session.UI;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhUnitsWindowItem : MonoBehaviour, IPointerEnterHandler, IEventSystemHandler, IPointerDownHandler, IPointerExitHandler
	{
		[SerializeField]
		private BhScaleAnim scale;

		[SerializeField]
		private Image pic;

		[SerializeField]
		private TextMeshProUGUI title;

		private UnitViewConfig buyo;

		private BhUnitsWindow buyp;

		public void Init(UnitViewConfig _unitViewConfig, BhUnitsWindow _unitsWindow)
		{
		}

		public void OnClick()
		{
		}

		public void OnPointerDown(PointerEventData eventData)
		{
		}

		public void OnPointerEnter(PointerEventData eventData)
		{
		}

		public void OnPointerExit(PointerEventData eventData)
		{
		}
	}
}
