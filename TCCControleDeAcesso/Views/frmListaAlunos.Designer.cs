namespace TCCControleDeAcesso.Views
{
    partial class frmListaAlunos
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.txtId = new System.Windows.Forms.TextBox();
            this.linkSelectPhoto = new System.Windows.Forms.LinkLabel();
            this.openFileDialog1 = new System.Windows.Forms.OpenFileDialog();
            this.pictureBox1 = new System.Windows.Forms.PictureBox();
            this.dgvAlunos = new System.Windows.Forms.DataGridView();
            this.txtArduino = new System.Windows.Forms.TextBox();
            this.txtIdOficial = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.acao = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.label4 = new System.Windows.Forms.Label();
            this.label6 = new System.Windows.Forms.Label();
            this.btnSave = new System.Windows.Forms.Button();
            this.BtnDelete = new System.Windows.Forms.Button();
            this.txtName = new RJCodeAdvance.RJControls.RJTextBox();
            this.txtRm = new RJCodeAdvance.RJControls.RJTextBox();
            this.txtIdade = new RJCodeAdvance.RJControls.RJTextBox();
            this.cboCurso = new RJCodeAdvance.RJControls.RJComboBox();
            this.comboBox2 = new RJCodeAdvance.RJControls.RJComboBox();
            this.panel2 = new System.Windows.Forms.Panel();
            this.btnVoltar = new System.Windows.Forms.Button();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox1)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.dgvAlunos)).BeginInit();
            this.panel2.SuspendLayout();
            this.SuspendLayout();
            // 
            // txtId
            // 
            this.txtId.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.txtId.Location = new System.Drawing.Point(-292, -164);
            this.txtId.Name = "txtId";
            this.txtId.Size = new System.Drawing.Size(283, 13);
            this.txtId.TabIndex = 79;
            // 
            // linkSelectPhoto
            // 
            this.linkSelectPhoto.AutoSize = true;
            this.linkSelectPhoto.Font = new System.Drawing.Font("Segoe UI", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.linkSelectPhoto.LinkColor = System.Drawing.Color.Black;
            this.linkSelectPhoto.Location = new System.Drawing.Point(1238, 591);
            this.linkSelectPhoto.Name = "linkSelectPhoto";
            this.linkSelectPhoto.Size = new System.Drawing.Size(91, 17);
            this.linkSelectPhoto.TabIndex = 78;
            this.linkSelectPhoto.TabStop = true;
            this.linkSelectPhoto.Text = "Escolher Foto";
            this.linkSelectPhoto.LinkClicked += new System.Windows.Forms.LinkLabelLinkClickedEventHandler(this.linkSelectPhoto_LinkClicked);
            // 
            // openFileDialog1
            // 
            this.openFileDialog1.FileName = "openFileDialog1";
            // 
            // pictureBox1
            // 
            this.pictureBox1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pictureBox1.Location = new System.Drawing.Point(1186, 321);
            this.pictureBox1.Name = "pictureBox1";
            this.pictureBox1.Size = new System.Drawing.Size(195, 270);
            this.pictureBox1.SizeMode = System.Windows.Forms.PictureBoxSizeMode.StretchImage;
            this.pictureBox1.TabIndex = 71;
            this.pictureBox1.TabStop = false;
            // 
            // dgvAlunos
            // 
            this.dgvAlunos.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dgvAlunos.Location = new System.Drawing.Point(428, 621);
            this.dgvAlunos.Name = "dgvAlunos";
            this.dgvAlunos.Size = new System.Drawing.Size(958, 363);
            this.dgvAlunos.TabIndex = 97;
            this.dgvAlunos.CellClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dgvAlunos_CellClick);
            // 
            // txtArduino
            // 
            this.txtArduino.HideSelection = false;
            this.txtArduino.Location = new System.Drawing.Point(600, 340);
            this.txtArduino.Name = "txtArduino";
            this.txtArduino.Size = new System.Drawing.Size(100, 20);
            this.txtArduino.TabIndex = 100;
            this.txtArduino.Visible = false;
            // 
            // txtIdOficial
            // 
            this.txtIdOficial.HideSelection = false;
            this.txtIdOficial.Location = new System.Drawing.Point(600, 366);
            this.txtIdOficial.Name = "txtIdOficial";
            this.txtIdOficial.Size = new System.Drawing.Size(100, 20);
            this.txtIdOficial.TabIndex = 98;
            this.txtIdOficial.Visible = false;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Segoe UI Semibold", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.ForeColor = System.Drawing.Color.Black;
            this.label1.Location = new System.Drawing.Point(539, 411);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(59, 21);
            this.label1.TabIndex = 85;
            this.label1.Text = "Nome:";
            // 
            // acao
            // 
            this.acao.AutoSize = true;
            this.acao.Font = new System.Drawing.Font("Arial", 15.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.acao.Location = new System.Drawing.Point(578, 561);
            this.acao.Name = "acao";
            this.acao.Size = new System.Drawing.Size(43, 24);
            this.acao.TabIndex = 99;
            this.acao.Text = "N/A";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Segoe UI Semibold", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.Location = new System.Drawing.Point(539, 504);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(56, 21);
            this.label2.TabIndex = 86;
            this.label2.Text = "Curso:";
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Segoe UI Semibold", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label3.Location = new System.Drawing.Point(539, 442);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(39, 21);
            this.label3.TabIndex = 87;
            this.label3.Text = "RM:";
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Font = new System.Drawing.Font("Segoe UI Semibold", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label4.Location = new System.Drawing.Point(835, 504);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(51, 21);
            this.label4.TabIndex = 88;
            this.label4.Text = "Série:";
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Font = new System.Drawing.Font("Segoe UI Semibold", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label6.Location = new System.Drawing.Point(539, 473);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(56, 21);
            this.label6.TabIndex = 95;
            this.label6.Text = "Idade:";
            // 
            // btnSave
            // 
            this.btnSave.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnSave.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnSave.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnSave.ForeColor = System.Drawing.SystemColors.WindowText;
            this.btnSave.Location = new System.Drawing.Point(994, 547);
            this.btnSave.Margin = new System.Windows.Forms.Padding(0);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(99, 58);
            this.btnSave.TabIndex = 91;
            this.btnSave.Text = "SALVAR";
            this.btnSave.UseVisualStyleBackColor = false;
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click_1);
            // 
            // BtnDelete
            // 
            this.BtnDelete.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.BtnDelete.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.BtnDelete.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.BtnDelete.ForeColor = System.Drawing.SystemColors.WindowText;
            this.BtnDelete.Location = new System.Drawing.Point(889, 547);
            this.BtnDelete.Margin = new System.Windows.Forms.Padding(0);
            this.BtnDelete.Name = "BtnDelete";
            this.BtnDelete.Size = new System.Drawing.Size(99, 59);
            this.BtnDelete.TabIndex = 94;
            this.BtnDelete.Text = "EXCLUIR";
            this.BtnDelete.UseVisualStyleBackColor = false;
            this.BtnDelete.Click += new System.EventHandler(this.BtnDelete_Click_1);
            // 
            // txtName
            // 
            this.txtName.BackColor = System.Drawing.SystemColors.Window;
            this.txtName.BorderColor = System.Drawing.Color.DodgerBlue;
            this.txtName.BorderFocusColor = System.Drawing.Color.DeepSkyBlue;
            this.txtName.BorderRadius = 0;
            this.txtName.BorderSize = 2;
            this.txtName.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.5F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtName.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(64)))), ((int)(((byte)(64)))));
            this.txtName.Location = new System.Drawing.Point(600, 402);
            this.txtName.Margin = new System.Windows.Forms.Padding(4);
            this.txtName.Multiline = false;
            this.txtName.Name = "txtName";
            this.txtName.Padding = new System.Windows.Forms.Padding(10, 7, 10, 7);
            this.txtName.PasswordChar = false;
            this.txtName.PlaceholderColor = System.Drawing.Color.DarkGray;
            this.txtName.PlaceholderText = "";
            this.txtName.Size = new System.Drawing.Size(493, 31);
            this.txtName.TabIndex = 101;
            this.txtName.Texts = "";
            this.txtName.UnderlinedStyle = true;
            // 
            // txtRm
            // 
            this.txtRm.BackColor = System.Drawing.SystemColors.Window;
            this.txtRm.BorderColor = System.Drawing.Color.DodgerBlue;
            this.txtRm.BorderFocusColor = System.Drawing.Color.DeepSkyBlue;
            this.txtRm.BorderRadius = 0;
            this.txtRm.BorderSize = 2;
            this.txtRm.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.5F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtRm.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(64)))), ((int)(((byte)(64)))));
            this.txtRm.Location = new System.Drawing.Point(600, 433);
            this.txtRm.Margin = new System.Windows.Forms.Padding(4);
            this.txtRm.Multiline = false;
            this.txtRm.Name = "txtRm";
            this.txtRm.Padding = new System.Windows.Forms.Padding(10, 7, 10, 7);
            this.txtRm.PasswordChar = false;
            this.txtRm.PlaceholderColor = System.Drawing.Color.DarkGray;
            this.txtRm.PlaceholderText = "";
            this.txtRm.Size = new System.Drawing.Size(493, 31);
            this.txtRm.TabIndex = 102;
            this.txtRm.Texts = "";
            this.txtRm.UnderlinedStyle = true;
            // 
            // txtIdade
            // 
            this.txtIdade.BackColor = System.Drawing.SystemColors.Window;
            this.txtIdade.BorderColor = System.Drawing.Color.DodgerBlue;
            this.txtIdade.BorderFocusColor = System.Drawing.Color.DeepSkyBlue;
            this.txtIdade.BorderRadius = 0;
            this.txtIdade.BorderSize = 2;
            this.txtIdade.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.5F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtIdade.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(64)))), ((int)(((byte)(64)))));
            this.txtIdade.Location = new System.Drawing.Point(600, 464);
            this.txtIdade.Margin = new System.Windows.Forms.Padding(4);
            this.txtIdade.Multiline = false;
            this.txtIdade.Name = "txtIdade";
            this.txtIdade.Padding = new System.Windows.Forms.Padding(10, 7, 10, 7);
            this.txtIdade.PasswordChar = false;
            this.txtIdade.PlaceholderColor = System.Drawing.Color.DarkGray;
            this.txtIdade.PlaceholderText = "";
            this.txtIdade.Size = new System.Drawing.Size(493, 31);
            this.txtIdade.TabIndex = 103;
            this.txtIdade.Texts = "";
            this.txtIdade.UnderlinedStyle = true;
            // 
            // cboCurso
            // 
            this.cboCurso.BackColor = System.Drawing.Color.WhiteSmoke;
            this.cboCurso.BorderColor = System.Drawing.Color.DodgerBlue;
            this.cboCurso.BorderSize = 2;
            this.cboCurso.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cboCurso.Font = new System.Drawing.Font("Microsoft Sans Serif", 10F);
            this.cboCurso.ForeColor = System.Drawing.Color.DimGray;
            this.cboCurso.IconColor = System.Drawing.Color.DodgerBlue;
            this.cboCurso.ListBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(230)))), ((int)(((byte)(228)))), ((int)(((byte)(245)))));
            this.cboCurso.ListTextColor = System.Drawing.Color.DimGray;
            this.cboCurso.Location = new System.Drawing.Point(601, 501);
            this.cboCurso.MinimumSize = new System.Drawing.Size(200, 30);
            this.cboCurso.Name = "cboCurso";
            this.cboCurso.Padding = new System.Windows.Forms.Padding(2);
            this.cboCurso.Size = new System.Drawing.Size(200, 30);
            this.cboCurso.TabIndex = 104;
            this.cboCurso.Texts = "";
            // 
            // comboBox2
            // 
            this.comboBox2.BackColor = System.Drawing.Color.WhiteSmoke;
            this.comboBox2.BorderColor = System.Drawing.Color.DodgerBlue;
            this.comboBox2.BorderSize = 2;
            this.comboBox2.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.comboBox2.Font = new System.Drawing.Font("Microsoft Sans Serif", 10F);
            this.comboBox2.ForeColor = System.Drawing.Color.DimGray;
            this.comboBox2.IconColor = System.Drawing.Color.DodgerBlue;
            this.comboBox2.Items.AddRange(new object[] {
            "1º Ano",
            "2º Ano",
            "3º Ano"});
            this.comboBox2.ListBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(230)))), ((int)(((byte)(228)))), ((int)(((byte)(245)))));
            this.comboBox2.ListTextColor = System.Drawing.Color.DimGray;
            this.comboBox2.Location = new System.Drawing.Point(893, 501);
            this.comboBox2.MinimumSize = new System.Drawing.Size(200, 30);
            this.comboBox2.Name = "comboBox2";
            this.comboBox2.Padding = new System.Windows.Forms.Padding(2);
            this.comboBox2.Size = new System.Drawing.Size(200, 30);
            this.comboBox2.TabIndex = 105;
            this.comboBox2.Texts = "";
            // 
            // panel2
            // 
            this.panel2.Controls.Add(this.btnVoltar);
            this.panel2.Location = new System.Drawing.Point(12, -3);
            this.panel2.Name = "panel2";
            this.panel2.Size = new System.Drawing.Size(40, 59);
            this.panel2.TabIndex = 107;
            // 
            // btnVoltar
            // 
            this.btnVoltar.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnVoltar.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.sair;
            this.btnVoltar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnVoltar.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVoltar.Location = new System.Drawing.Point(-18, -3);
            this.btnVoltar.Name = "btnVoltar";
            this.btnVoltar.Size = new System.Drawing.Size(62, 70);
            this.btnVoltar.TabIndex = 57;
            this.btnVoltar.UseVisualStyleBackColor = false;
            this.btnVoltar.Click += new System.EventHandler(this.btnVoltar_Click_1);
            // 
            // frmListaAlunos
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.Design_sem_nome__1_2;
            this.ClientSize = new System.Drawing.Size(1904, 1061);
            this.Controls.Add(this.panel2);
            this.Controls.Add(this.comboBox2);
            this.Controls.Add(this.cboCurso);
            this.Controls.Add(this.txtIdade);
            this.Controls.Add(this.txtRm);
            this.Controls.Add(this.txtName);
            this.Controls.Add(this.dgvAlunos);
            this.Controls.Add(this.txtArduino);
            this.Controls.Add(this.txtIdOficial);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.acao);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.label6);
            this.Controls.Add(this.btnSave);
            this.Controls.Add(this.BtnDelete);
            this.Controls.Add(this.txtId);
            this.Controls.Add(this.linkSelectPhoto);
            this.Controls.Add(this.pictureBox1);
            this.Font = new System.Drawing.Font("Arial", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.Name = "frmListaAlunos";
            this.Text = "frmListaAlunos";
            this.WindowState = System.Windows.Forms.FormWindowState.Maximized;
            this.Load += new System.EventHandler(this.frmListaAlunos_Load);
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox1)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.dgvAlunos)).EndInit();
            this.panel2.ResumeLayout(false);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion
        private System.Windows.Forms.TextBox txtId;
        private System.Windows.Forms.LinkLabel linkSelectPhoto;
        private System.Windows.Forms.PictureBox pictureBox1;
        private System.Windows.Forms.OpenFileDialog openFileDialog1;
        private System.Windows.Forms.DataGridView dgvAlunos;
        private System.Windows.Forms.TextBox txtArduino;
        private System.Windows.Forms.TextBox txtIdOficial;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label acao;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.Button BtnDelete;
        private RJCodeAdvance.RJControls.RJTextBox txtName;
        private RJCodeAdvance.RJControls.RJTextBox txtRm;
        private RJCodeAdvance.RJControls.RJTextBox txtIdade;
        private RJCodeAdvance.RJControls.RJComboBox cboCurso;
        private RJCodeAdvance.RJControls.RJComboBox comboBox2;
        private System.Windows.Forms.Panel panel2;
        private System.Windows.Forms.Button btnVoltar;
    }
}