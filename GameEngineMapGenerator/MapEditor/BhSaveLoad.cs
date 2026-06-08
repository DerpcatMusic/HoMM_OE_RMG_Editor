using System.Collections.Generic;
using Hex.UI;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhSaveLoad : BhScreenElement
	{
		public enum EMode
		{
			Mode_Open = 0,
			Mode_Save = 1,
			ModeOpenFolder = 2
		}

		private const int bujh = 10;

		[SerializeField]
		private BhSaveLoadElement prefab;

		[SerializeField]
		private BhFolderElement folderPrefab;

		[SerializeField]
		private BhFolderElement backElement;

		[Space]
		[SerializeField]
		private TMP_InputField inputFieldName;

		[SerializeField]
		private Transform content;

		[SerializeField]
		private TextMeshProUGUI textCaption;

		[SerializeField]
		private TextMeshProUGUI textOkBtn;

		private BhFilesElement buji;

		private List<BhSaveLoadElement> bujj;

		private List<BhFolderElement> bujk;

		private Queue<BhSaveLoadElement> bujl;

		private Queue<BhFolderElement> bujm;

		private pw bujn;

		private EMode bujo;

		private EMode bujp;

		private void Start()
		{
		}

		public void nhk()
		{
		}

		public void nhl()
		{
		}

		public override void Show()
		{
		}

		private void nhm(List<pv> a)
		{
		}

		public void nhn(BhFolderElement a, bool b)
		{
		}

		public void nho(string a, EMode b, BhFilesElement c, bool d)
		{
		}

		public void OnBtnLoad()
		{
		}

		public void Save()
		{
		}

		public void nhp()
		{
		}

		private void nhq(EMode a)
		{
		}

		private void nhr(pw a)
		{
		}

		private void nhs(BhFilesElement a)
		{
		}

		private void nht()
		{
		}

		private void nhu(pw a)
		{
		}

		private void nhv(BhFolderElement a, bool b)
		{
		}

		private void nhw(string a)
		{
		}

		private void nhx<a>(a a, Queue<a> b) where a : MonoBehaviour
		{
		}

		private BhSaveLoadElement nhy()
		{
			return null;
		}

		private BhFolderElement nhz()
		{
			return null;
		}

		private void nia(BhSaveLoadElement a)
		{
		}

		private void nib(BhFolderElement a)
		{
		}

		private void nic(BhFilesElement a)
		{
		}

		private void nid(BhFilesElement a)
		{
		}
	}
}
