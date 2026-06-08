using Hex.Configs;
using Hex.Session.UI;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhSquadWindowItem : MonoBehaviour, IPointerEnterHandler, IEventSystemHandler, IPointerDownHandler, IPointerExitHandler
	{
		[SerializeField]
		private BhScaleAnim scale;

		[SerializeField]
		private Image pic;

		[SerializeField]
		private TextMeshProUGUI title;

		private SquadConfig buyi;

		private BhSquadWindow buyj;

		public void Init(SquadConfig _squadConfig, BhSquadWindow _squadWindow)
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
